.PHONY: build

build: node_modules
	npm run build-minify

node_modules:
	npm install
