"""
main.py
----------------
This is the file you RUN. It just starts the application.
In VS Code: open this file, press the "Run" (▶) button top-right,
or press F5.
"""

import tkinter as tk
from ui import TickerApp


def main():
    root = tk.Tk()
    app = TickerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
