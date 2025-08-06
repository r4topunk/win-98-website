import { DesktopIcon } from "./desktop-icon";

export function Desktop() {
  return (
    <div className="flex flex-1 items-start p-1 relative">
      <div>
        <DesktopIcon icon_path="/icons/camera3_vid-2.png" icon_name="Movies" />
        <DesktopIcon icon_path="/icons/camera3-2.png" icon_name="Images" />
        <DesktopIcon
          icon_path="/icons/computer_explorer_cool-0.png"
          icon_name="Computer"
        />
        <DesktopIcon icon_path="/icons/modem-5.png" icon_name="Contato" />
        <DesktopIcon icon_path="/icons/msagent-3.png" icon_name="Lojinha" />
        <DesktopIcon
          icon_path="/icons/overlay_share_cool-3.png"
          icon_name="???"
        />
        <DesktopIcon
          icon_path="/icons/recycle_bin_full-4.png"
          icon_name="Rejects"
        />
      </div>
      <div>
        <DesktopIcon icon_path="/icons/world-4.png" icon_name="Pelo mundo" />
        <DesktopIcon
          icon_path="/icons/cd_audio_cd_a-3.png"
          icon_name="Album Covers"
        />
        <DesktopIcon
          icon_path="/icons/network_internet_pcs_installer-4.png"
          icon_name="Customs"
        />
        <DesktopIcon icon_path="/icons/imaggif-1.png" icon_name="Desenhe" />
        <DesktopIcon icon_path="/icons/hardware-4.png" icon_name="W.I.P." />
      </div>
      
      {/* Error icon positioned absolutely in bottom right corner */}
      <div className="absolute bottom-1 right-1">
        <DesktopIcon icon_path="/icons/msg_error-0.png" icon_name="Error" />
      </div>
    </div>
  );
}
