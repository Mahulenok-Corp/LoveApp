#!/bin/bash
npx autocannon -c 100 -d 20 \
-H "X-Telegram-InitData: query_id=AAHE4wIxAAAAAMTjAjEd9cfc&user=%7B%22id%22%3A822272964%2C%22first_name%22%3A%22Ivan%22%2C%22last_name%22%3A%22Irbov%22%2C%22username%22%3A%22justagent5%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FVXI6kacweJMeJtWLn4DTTFsuilBHkvJ0n8wMxaPhGy8.svg%22%7D&auth_date=1732867925&signature=OnEmJ8qI5XZPBfEGVpqyC1E3PkjVB2iUVz042YH3qzX61pfiNGeWdoupEY7MSuT-2uDfzg8ffoeyxmFJZjpKBg&hash=3dfdc992af214dff2321b1874d75d06d32054d139b30bc833eea6e18ab03bfb0" \
http://localhost:3000/api/v2/users/everyday-rewards