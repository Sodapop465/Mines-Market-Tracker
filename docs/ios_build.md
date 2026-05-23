### Build a .ipa for iOS locally

##### Disclaimer: I wrote this from memory so I can figure it out in the future

1. Get a mac
2. Open the project
3. Run `npx expo prebuild`
  - Delete `ios` directory if weird things happen
4. Download Xcode
5. Open newly generated `ios` in Xcode
6. Use Apple account to sign app
7. Change build configuration to Release
8. Create an archive: Product > Archive?
9. Use <a href="https://github.com/timmiehaha/ipagen">ipagen</a> to generate .ipa from archive

