SRCS = \
	src/theta-viewer.js

CAT = build/theta-viewer.js

MINIFY = build/theta-viewer.min.js

all: $(MINIFY)

$(MINIFY): $(CAT)
	uglifyjs -c -o $(MINIFY) $(CAT)

$(CAT): $(SRCS)
	cat $(SRCS) > $(CAT)

check: $(SRC)
	jshint $(SRCS)

clean:
	rm -f build/*
