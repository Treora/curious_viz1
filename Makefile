.PHONY: build

build: d3.v4.min.js
	npm run build-minify

d3.v4.min.js:
	wget https://d3js.org/d3.v4.min.js
