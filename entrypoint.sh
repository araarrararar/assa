#!/bin/bash
# Set the log stream name based on the current date and time
#LOG_STREAM_NAME=$(date +"%Y/%m/%d/[\$LATEST]$(uuidgen | tr '[:upper:]' '[:lower:]')")
# Generate a dynamic log stream name

# Generate date-time formatted log stream name
export AWSLOGS_STREAM_NAME="app-log-stream-$(date +%Y-%m-%d-%H-%M-%S)"

exec npm start