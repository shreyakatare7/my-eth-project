import pandas as pd
import matplotlib.pyplot as plt

# Load data from CSV files
metrics_df = pd.read_csv('metrics.csv')
concurrency_df = pd.read_csv('concurrency_metrics.csv', header=None, names=["Clients", "TotalTime(ms)"])

# Plot 1: Handshake Time
plt.figure(figsize=(10, 6))
plt.bar(metrics_df["Device"], metrics_df["HandshakeTime(ms)"], color='steelblue')
plt.title("Time to Complete Handshake for Each Device")
plt.xlabel("Device")
plt.ylabel("Time (ms)")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("handshake_time.png")
plt.show()

# Plot 2: Key Generation Time
plt.figure(figsize=(10, 6))
plt.bar(metrics_df["Device"], metrics_df["KeyGenerationTime(ms)"], color='orange')
plt.title("Time for Key Generation per Device")
plt.xlabel("Device")
plt.ylabel("Time (ms)")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("keygen_time.png")
plt.show()

# Plot 3: Encryption and Decryption
plt.figure(figsize=(10, 6))
bar_width = 0.35
x = range(len(metrics_df["Device"]))

plt.bar(x, metrics_df["EncryptionTime(ms)"], width=bar_width, label='Encryption', color='green')
plt.bar([i + bar_width for i in x], metrics_df["DecryptionTime(ms)"], width=bar_width, label='Decryption', color='red')

plt.xlabel("Device")
plt.ylabel("Time (ms)")
plt.title("Encryption vs Decryption Time per Device")
plt.xticks([i + bar_width/2 for i in x], metrics_df["Device"], rotation=45)
plt.legend()
plt.tight_layout()
plt.savefig("encryption_decryption.png")
plt.show()

#Plot 4: Concurrency Impact
plt.figure(figsize=(10, 6))
plt.plot(concurrency_df["Clients"], concurrency_df["TotalTime(ms)"], marker='o', color='purple')
plt.title("Impact of Concurrent Clients on Total Response Time")
plt.xlabel("Number of Concurrent Clients")
plt.ylabel("Total Time (ms)")
plt.grid(True)
plt.tight_layout()
plt.savefig("concurrency_impact.png")
plt.show()
