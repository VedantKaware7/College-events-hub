#!/usr/bin/env bash
# Q2b: role checks on update/delete and TOTP MFA login (codes generated like an authenticator app).
set -uo pipefail
cd "$(dirname "$0")/../.."
API=${API:-http://127.0.0.1:8081/api}
totp() { node -e "console.log(require('./server/node_modules/otplib').authenticator.generate(process.argv[1]))" "$1"; }
json() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const o=JSON.parse(d);console.log(process.argv[1].split('.').reduce((a,k)=>a&&a[k],o) ?? '')})" "$1"; }
signin() { curl -s -X POST "$API/auth/signin" -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"password123\"}"; }
req() {   # $1 label, rest = curl args; prints status + body
    local out; out=$(curl -s -w '\n%{http_code}' "${@:2}")
    printf '%-58s -> HTTP %s  %s\n' "$1" "$(tail -1 <<<"$out")" "$(sed '$d' <<<"$out" | cut -c1-90)"
}

STUDENT=$(signin student@college.edu | json token)
FACULTY=$(signin faculty@college.edu | json token)
ADMIN=$(signin admin@college.edu | json token)
EVENTS=$(curl -s "$API/events")
FAC_EVENT=$(node -e "const e=JSON.parse(process.argv[1]);console.log(e.find(x=>x.organizer.email==='faculty@college.edu')._id)" "$EVENTS")
ADMIN_EVENT=$(node -e "const e=JSON.parse(process.argv[1]);console.log(e.filter(x=>x.organizer.email==='admin@college.edu').pop()._id)" "$EVENTS")
BODY='{"venue":"Main Auditorium (updated)"}'

echo "== Role-based access on PUT/DELETE /api/events/:id"
req "PUT    no token"                       -X PUT "$API/events/$FAC_EVENT" -H 'Content-Type: application/json' -d "$BODY"
req "DELETE no token"                       -X DELETE "$API/events/$ADMIN_EVENT"
req "PUT    forged token (wrong signature)" -X PUT "$API/events/$FAC_EVENT" -H "Authorization: Bearer ${ADMIN%?}x" -H 'Content-Type: application/json' -d "$BODY"
req "PUT    student token"                  -X PUT "$API/events/$FAC_EVENT" -H "Authorization: Bearer $STUDENT" -H 'Content-Type: application/json' -d "$BODY"
req "DELETE student token"                  -X DELETE "$API/events/$ADMIN_EVENT" -H "Authorization: Bearer $STUDENT"
req "PUT    faculty token, admin's event"   -X PUT "$API/events/$ADMIN_EVENT" -H "Authorization: Bearer $FACULTY" -H 'Content-Type: application/json' -d "$BODY"
req "PUT    faculty token, own event"       -X PUT "$API/events/$FAC_EVENT" -H "Authorization: Bearer $FACULTY" -H 'Content-Type: application/json' -d "$BODY"
req "PUT    admin token, any event"         -X PUT "$API/events/$ADMIN_EVENT" -H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json' -d "$BODY"

echo
echo "== TOTP MFA enrolment + login (faculty@college.edu)"
SETUP=$(curl -s -X POST "$API/auth/mfa/setup" -H "Authorization: Bearer $FACULTY")
SECRET=$(json secret <<<"$SETUP")
echo "setup  -> otpauthUrl=$(json otpauthUrl <<<"$SETUP" | sed 's/secret=[A-Z0-9]*/secret=<hidden>/')  qrCode=$(json qrCode <<<"$SETUP" | cut -c1-30)..."
req "enable with wrong code 000000"         -X POST "$API/auth/mfa/enable" -H "Authorization: Bearer $FACULTY" -H 'Content-Type: application/json' -d '{"code":"000000"}'
req "enable with code from authenticator"   -X POST "$API/auth/mfa/enable" -H "Authorization: Bearer $FACULTY" -H 'Content-Type: application/json' -d "{\"code\":\"$(totp "$SECRET")\"}"
STEP1=$(signin faculty@college.edu)
echo "signin with password only -> $(cut -c1-75 <<<"$STEP1")..."
MFA_TOKEN=$(json mfaToken <<<"$STEP1")
req "use MFA challenge token as a session"  -X PUT "$API/events/$FAC_EVENT" -H "Authorization: Bearer $MFA_TOKEN" -H 'Content-Type: application/json' -d "$BODY"
req "mfa/verify with wrong code"            -X POST "$API/auth/mfa/verify" -H 'Content-Type: application/json' -d "{\"mfaToken\":\"$MFA_TOKEN\",\"code\":\"000000\"}"
req "mfa/verify with authenticator code"    -X POST "$API/auth/mfa/verify" -H 'Content-Type: application/json' -d "{\"mfaToken\":\"$MFA_TOKEN\",\"code\":\"$(totp "$SECRET")\"}"
