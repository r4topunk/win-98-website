interface DesktopIconProps {
  icon_path: string;
  icon_name: string;
}

export function DesktopIcon({ icon_path, icon_name }: DesktopIconProps) {
  return (
    <button className="flex flex-col gap-1 items-center justify-center p-2! bg-transparent! shadow-none! cursor-pointer w-full">
      <img
        src={icon_path}
        alt={icon_name}
        width={32}
        className="pointer-events-none"
      />
      <p className="font-['Pixelated MS Sans Serif'] text-white font-light!">
        {icon_name}
      </p>
    </button>
  );
}
