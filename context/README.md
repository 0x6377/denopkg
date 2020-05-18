# lifecycle context

It is useful to have an object throughout your application that
contains "semi-globals". Things that you always want, but might change
thoughout the course of your application's runtime.

For example a webserver may do different things for each request, or
want a logger with extra meta-data for each request.

A task processor may want to have per-task information.

I have found that such a context object is extremely useful.

This is based on prior work of mine and borrows some ideas from Golang's `context` package.
