# Use Python 3.9 base image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the current project files into the container
COPY . /app

# Install required dependencies
RUN pip install --no-cache-dir sawtooth-sdk protobuf

# Set the default command to run the script
CMD ["python3", "iot_transaction_processor.py"]
