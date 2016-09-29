.PHONY: build

build: dist/d3.v4.min.js node_modules
	npm run build-minify

dist/d3.v4.min.js:
	wget -P dist https://d3js.org/d3.v4.min.js

node_modules:
	npm install
