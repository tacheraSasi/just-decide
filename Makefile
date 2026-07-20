run:
	bun start -c


update-version: 
	expobump 

build-apk: update-version
	bunx eas build -p android --profile preview