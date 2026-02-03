# Fresh Expo + Supabase Minimal App

## Location
`/app/mobile-clean/`

## What's Built
A minimal, working Expo app with Supabase authentication:
- Simple email/password auth
- Sign up, sign in, sign out
- Session persistence
- AsyncStorage for tokens
- NO Fabric/New Architecture
- NO complex navigation
- NO context providers
- MINIMAL dependencies

## Structure
```
/app/mobile-clean/
├── App.js           # Main app with auth UI
├── lib/
│   └── supabase.js  # Supabase client config
├── package.json
└── app.json
```

## How to Test

### On Your Device (iOS/Android):
```bash
cd /app/mobile-clean
npx expo start
```
Then scan the QR code with Expo Go app.

### On Web (for quick testing):
```bash
cd /app/mobile-clean
npx expo start --web
```

## Supabase Config
- URL: https://aiylthjfiqemwzxcgjnf.supabase.co
- Using same database as before
- Auth works with existing schema

## What's Different from Previous Build
1. **AsyncStorage instead of SecureStore** - Simpler, more reliable
2. **No React Navigation** - Just one screen to test auth first
3. **No Fabric** - Using old architecture to avoid boolean issues
4. **No AuthContext** - Direct useState in App.js
5. **Minimal dependencies** - Only essentials

## Next Steps (After This Works)

Once you confirm this loads without errors on Expo Go:

### Phase 1: Add Navigation
- Install React Navigation
- Add Projects list screen
- Test navigation works

### Phase 2: Add Projects CRUD
- Projects list
- Create project
- Test database operations

### Phase 3: Add Criteria
- Load system criteria
- Manage preferences
- Test with enums

### Phase 4: Test on Fabric (Optional)
- Add newArchEnabled if needed
- Test if Fabric still has issues

## Testing Checklist
- [ ] App loads without crashes
- [ ] Can sign up new user
- [ ] Can sign in
- [ ] Can sign out
- [ ] Session persists after reload
- [ ] No "expected boolean but got string" errors

## If This Works
We can incrementally migrate features from the old app, testing at each step to catch any issues early.
