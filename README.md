Asus VivoBook Thermal Fix (The "Fan-Forcer")

This project is a workaround for a specific thermal throttling issue found on Asus VivoBook laptops. By default, the system firmware often prematurely throttles the CPU when the fan speed is only at 70%, preventing the hardware from reaching its full cooling potential.

This utility forces the fan into Performance Mode every 10 seconds. This prevents the BIOS from down-clocking the fan to the 50%–70% range, ensuring it stays between 80% and 100% duty cycle during heavy loads.
🚀 The Problem

On certain VivoBook models, the internal fan controller is "lazy." Even under heavy load, the fan often dips into lower RPMs. The CPU sees the rising heat, doesn't see a 100% fan speed response, and throttles the clock speed to prevent damage.
✅ The Solution

By sending a heartbeat signal to the Asus ACPI/WMI interface every 10 seconds, we override the "Standard" or "Silent" profiles that the system tries to revert to. This keeps the fan aggressive and the CPU clocks stable.
📦 Installation & Usage
Option 1: The "Vibe-Coded" GUI

If you prefer a visual interface, you can run the GUI.

    Note: Because this was built using modern web-to-desktop "vibe-coding" tools, the executable is roughly 500MB. It’s an absolute unit of an electron app, but it gets the job done.

    Download the latest release.

    Run the executable as Administrator (required to access fan controllers).

    Toggle "Active" to start the 10-second heartbeat loop.

Option 2: The Lightweight Way (Node.js)

If you want to avoid the 500MB overhead, you can run the logic directly via npm.
Bash

# Clone the repo
git clone https://github.com/your-repo/asus-fan-fix
cd asus-fan-fix

# Install dependencies
npm install

# Run the script
fan-2.bat (performance mode)

🛠️ Technical Details

The core logic relies on calling the Asus-specific WMI methods. The script performs the equivalent of:

    Identifying the AsusWmiSrv or similar system service.

    Writing 0x1 (Performance Mode) to the Fan Policy register.

    Sleeping for 10,000ms.

    Repeating indefinitely.

⚠️ Disclaimer

Use at your own risk. Forcing your fan to run at high speeds constantly can lead to faster wear and tear on the fan bearing. This tool was created to solve a specific firmware-level throttling bug and should be used primarily during gaming or heavy rendering sessions.
