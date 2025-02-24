interface NavbarProps {
  openStartMenu: () => void;
}

export function Navbar({ openStartMenu }: NavbarProps) {
  return (
    <div className="window h-8">
      <div className="title-bar-text mr-0! flex justify-between items-center p-0.5">
        <button
          className="px-4 py-1 flex gap-2 items-center"
          onClick={openStartMenu}
        >
          <img src="/icons/windows_slanted-0.png" alt="Windows logo" />
          Start
        </button>
        <button className="active font-medium">4:20 PM</button>
      </div>
    </div>
  );
}
