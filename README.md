# 🌪️ Asus VivoBook Thermal Fix (The "Fan-Forcer")

This project is a workaround for a specific thermal throttling issue found on Asus VivoBook laptops. By default, the system firmware often prematurely throttles the CPU when the fan speed is only at 70%, preventing the hardware from reaching its full cooling potential.

This utility forces the fan into **Performance Mode** every 10 seconds. This prevents the BIOS from down-clocking the fan to the 50%–70% range, ensuring it stays between **80% and 100%** duty cycle during heavy loads.

---

## 🚀 The Problem
On certain VivoBook models, the internal fan controller is "lazy." Even under heavy load, the fan often dips into lower RPMs. The CPU detects the rising heat, notices the lack of a 100% fan speed response, and throttles the clock speed to prevent damage—even though the fan has more room to spin.

## ✅ The Solution
By sending a heartbeat signal to the **Asus ACPI/WMI interface** every 10 seconds, this tool overrides the "Standard" or "Silent" profiles that the system tries to revert to. This keeps the fan aggressive and the CPU clocks stable.

---

## 📦 Installation & Usage

### Option 1: The "Vibe-Coded" GUI
If you prefer a visual interface, you can run the GUI.
> **Note:** Because this was built using modern web-to-desktop "vibe-coding" tools, the executable is roughly **500MB**. It’s a total abomination of an Electron app, but it gets the job done.

1. **Download** the latest release.
2. **Run** the executable as **Administrator** (required to access fan controllers).
3. **Toggle "Active"** to start the 10-second heartbeat loop.

### Option 2: The Lightweight Way (Node.js)
If you want to avoid the 500MB overhead, you can run the logic directly via npm/scripts.

```bash
# Clone the repo

# Install dependencies
npm install

# Run the performance heartbeat
./fan-2.bat
