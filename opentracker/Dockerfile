FROM alpine:3.20 AS builder

RUN apk add --no-cache git gcc make musl-dev zlib-dev zlib-static

WORKDIR /build

# Clone libowfat (dependency of opentracker)
RUN git clone https://erdgeist.org/arts/software/libowfat.git libowfat
RUN cd libowfat && make

# Clone and build opentracker
RUN git clone https://erdgeist.org/arts/software/opentracker.git opentracker
RUN cd opentracker && make

# ─── Runtime ──────────────────────────────────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates

COPY --from=builder /build/opentracker/opentracker /usr/local/bin/opentracker

# UDP and TCP
EXPOSE 6969/tcp 6969/udp

CMD ["/usr/local/bin/opentracker", "-p", "6969", "-P", "6969"]
