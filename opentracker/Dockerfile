FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends opentracker && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 6969/tcp 6969/udp

CMD ["opentracker", "-p", "6969", "-P", "6969"]
