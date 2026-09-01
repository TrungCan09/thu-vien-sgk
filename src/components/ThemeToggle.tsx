import { IconButton, Tooltip } from "@radix-ui/themes";
import { Moon, Sun } from "@phosphor-icons/react";
import { useThemePreference } from "../lib/theme";

export function ThemeToggle() {
  const { resolved, setPreference } = useThemePreference();
  const next = resolved === "light" ? "dark" : "light";
  const label = next === "dark" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng";
  return (
    <Tooltip content={label}>
      <IconButton className="theme-toggle" variant="soft" size="3" aria-label={label} onClick={() => setPreference(next)}>
        {resolved === "light" ? <Moon size={20} weight="bold" /> : <Sun size={20} weight="bold" />}
      </IconButton>
    </Tooltip>
  );
}
