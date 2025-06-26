#!/usr/bin/env bash
set -euo pipefail

BASE=${VITE_API_URL:-http://localhost:4000}

echo "=== 1) Healthcheck ==="
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
if [[ "$status" == "200" ]]; then
  echo "  [OK] /health → 200"
else
  echo "  [FAIL] /health → $status" >&2
  exit 1
fi

echo
echo "=== 2) CRUD on /users ==="
# a) Список должен быть пустым
echo -n "  GET /users ... "
out=$(curl -s -w "\\n%{http_code}" "$BASE/users")
body=$(head -n -1 <<<"$out")
code=$(tail -n1   <<<"$out")
if [[ "$code" == "200" && "$body" == "[]" ]]; then
  echo "[OK]"
else
  echo "[FAIL] got code=$code, body=$body" >&2
  exit 1
fi

# b) Создаём пользователя
echo -n "  POST /users ... "
out=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"t@example.com"}' \
  "$BASE/users" -w "\\n%{http_code}")
body=$(head -n -1 <<<"$out")
code=$(tail -n1   <<<"$out")
if [[ "$code" == "201" && "$body" =~ \"id\":1 ]]; then
  echo "[OK]"
else
  echo "[FAIL] got code=$code, body=$body" >&2
  exit 1
fi

# c) GET /users должен вернуть массив с нашим юзером
echo -n "  GET /users again ... "
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users")
if [[ "$status" == "200" ]]; then
  echo "[OK]"
else
  echo "[FAIL] code=$status" >&2
  exit 1
fi

# d) GET /users/1
echo -n "  GET /users/1 ... "
out=$(curl -s -w "\\n%{http_code}" "$BASE/users/1")
body=$(head -n -1 <<<"$out")
code=$(tail -n1   <<<"$out")
if [[ "$code" == "200" && "$body" =~ \"email\":\"t@example.com\" ]]; then
  echo "[OK]"
else
  echo "[FAIL] got code=$code, body=$body" >&2
  exit 1
fi

# e) PUT /users/1
echo -n "  PUT /users/1 ... "
out=$(curl -s -X PUT -H 'Content-Type: application/json' \
  -d '{"name":"Foo"}' \
  "$BASE/users/1" -w "\\n%{http_code}")
body=$(head -n -1 <<<"$out")
code=$(tail -n1   <<<"$out")
if [[ "$code" == "200" && "$body" =~ \"name\":\"Foo\" ]]; then
  echo "[OK]"
else
  echo "[FAIL] got code=$code, body=$body" >&2
  exit 1
fi

# f) DELETE /users/1
echo -n "  DELETE /users/1 ... "
code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/users/1")
if [[ "$code" == "204" ]]; then
  echo "[OK]"
else
  echo "[FAIL] code=$code" >&2
  exit 1
fi

# g) GET /users/1 → 404
echo -n "  GET /users/1 after delete ... "
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users/1")
if [[ "$code" == "404" ]]; then
  echo "[OK]"
else
  echo "[FAIL] code=$code" >&2
  exit 1
fi

echo
echo "✅ All backend endpoints work as expected!"
