from __future__ import annotations

import json
from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from src.database import dict_from_row, get_db_connection, log_event

auth_bp = Blueprint("auth", __name__)


def current_user() -> dict | None:
    user_id = get_jwt_identity()

    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT id, name, email, role, is_active, created_at
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    ).fetchone()
    conn.close()

    return dict_from_row(row)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = current_user()

        if not user or user["role"] != "admin":
            return jsonify({"error": "Admin access required"}), 403

        return fn(*args, **kwargs)

    return wrapper


@auth_bp.post("/auth/register")
def register():
    data = request.get_json() or {}

    name = str(data.get("name") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = get_db_connection()

    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Email already registered"}), 409

    user_count = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
    role = "admin" if user_count == 0 else "user"

    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
        """,
        (name, email, generate_password_hash(password), role),
    )

    user_id = cur.lastrowid
    conn.commit()
    conn.close()

    log_event("REGISTER", f"New {role} registered: {email}", user_id)

    token = create_access_token(identity=str(user_id))
    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "is_active": 1,
        },
    })


@auth_bp.post("/auth/login")
def login():
    data = request.get_json() or {}

    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")

    conn = get_db_connection()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not row["is_active"]:
        return jsonify({"error": "This account has been disabled"}), 403

    token = create_access_token(identity=str(row["id"]))
    log_event("LOGIN", f"{email} logged in", row["id"])

    return jsonify({
        "token": token,
        "user": {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "role": row["role"],
            "is_active": row["is_active"],
        },
    })


@auth_bp.get("/auth/me")
@jwt_required()
def me():
    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user})


@auth_bp.get("/user/preferences")
@jwt_required()
def get_preferences():
    user = current_user()

    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT id, preferences_json, updated_at
        FROM user_preferences
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (user["id"],),
    ).fetchone()
    conn.close()

    if not row:
        return jsonify({"preferences": None})

    return jsonify({
        "preferences": {
            "id": row["id"],
            "filters": json.loads(row["preferences_json"]),
            "updated_at": row["updated_at"],
        }
    })


@auth_bp.post("/user/preferences")
@jwt_required()
def save_preferences():
    user = current_user()
    data = request.get_json() or {}
    filters = data.get("filters") or {}

    conn = get_db_connection()

    conn.execute("DELETE FROM user_preferences WHERE user_id = ?", (user["id"],))
    conn.execute(
        """
        INSERT INTO user_preferences (user_id, preferences_json)
        VALUES (?, ?)
        """,
        (user["id"], json.dumps(filters)),
    )

    conn.commit()
    conn.close()

    log_event("SAVE_PREFERENCES", "User saved house finder preferences", user["id"])
    return jsonify({"message": "Preferences saved"})


@auth_bp.delete("/user/preferences")
@jwt_required()
def delete_preferences():
    user = current_user()

    conn = get_db_connection()
    conn.execute("DELETE FROM user_preferences WHERE user_id = ?", (user["id"],))
    conn.commit()
    conn.close()

    log_event("DELETE_PREFERENCES", "User deleted house finder preferences", user["id"])
    return jsonify({"message": "Preferences deleted"})


@auth_bp.get("/user/saved-searches")
@jwt_required()
def get_saved_searches():
    user = current_user()

    conn = get_db_connection()
    rows = conn.execute(
        """
        SELECT id, search_name, filters_json, created_at
        FROM saved_searches
        WHERE user_id = ?
        ORDER BY id DESC
        """,
        (user["id"],),
    ).fetchall()
    conn.close()

    searches = []
    for row in rows:
        item = dict(row)
        item["filters"] = json.loads(item.pop("filters_json"))
        searches.append(item)

    return jsonify({"saved_searches": searches})


@auth_bp.post("/user/saved-searches")
@jwt_required()
def save_search():
    user = current_user()
    data = request.get_json() or {}

    search_name = str(data.get("search_name") or "Saved Search").strip()
    filters = data.get("filters") or {}

    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO saved_searches (user_id, search_name, filters_json)
        VALUES (?, ?, ?)
        """,
        (user["id"], search_name, json.dumps(filters)),
    )
    conn.commit()
    conn.close()

    log_event("SAVE_SEARCH", f"Saved search: {search_name}", user["id"])
    return jsonify({"message": "Search saved"})


@auth_bp.delete("/user/saved-searches/<int:search_id>")
@jwt_required()
def delete_saved_search(search_id: int):
    user = current_user()

    conn = get_db_connection()
    conn.execute(
        "DELETE FROM saved_searches WHERE id = ? AND user_id = ?",
        (search_id, user["id"]),
    )
    conn.commit()
    conn.close()

    log_event("DELETE_SEARCH", f"Deleted saved search {search_id}", user["id"])
    return jsonify({"message": "Saved search deleted"})


@auth_bp.get("/admin/users")
@admin_required
def admin_users():
    conn = get_db_connection()
    rows = conn.execute(
        """
        SELECT id, name, email, role, is_active, created_at
        FROM users
        ORDER BY id DESC
        """
    ).fetchall()
    conn.close()

    return jsonify({"users": [dict(row) for row in rows]})


@auth_bp.post("/admin/users/<int:user_id>/toggle")
@admin_required
def admin_toggle_user(user_id: int):
    admin = current_user()

    conn = get_db_connection()
    user = conn.execute(
        "SELECT id, is_active FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    new_status = 0 if user["is_active"] else 1

    conn.execute(
        "UPDATE users SET is_active = ? WHERE id = ?",
        (new_status, user_id),
    )
    conn.commit()
    conn.close()

    log_event("ADMIN_TOGGLE_USER", f"Admin toggled user {user_id} to {new_status}", admin["id"])

    return jsonify({"message": "User status updated", "is_active": new_status})


@auth_bp.get("/admin/logs")
@admin_required
def admin_logs():
    conn = get_db_connection()
    rows = conn.execute(
        """
        SELECT
            system_logs.id,
            system_logs.action,
            system_logs.details,
            system_logs.created_at,
            users.email AS user_email
        FROM system_logs
        LEFT JOIN users ON users.id = system_logs.user_id
        ORDER BY system_logs.id DESC
        LIMIT 100
        """
    ).fetchall()
    conn.close()

    return jsonify({"logs": [dict(row) for row in rows]})


@auth_bp.post("/admin/retrain-model")
@admin_required
def admin_retrain_model():
    admin = current_user()
    log_event("ADMIN_RETRAIN_MODEL", "Admin requested model retraining", admin["id"])

    return jsonify({
        "message": "Retrain request logged. Run python train_model.py from terminal to retrain safely."
    })
