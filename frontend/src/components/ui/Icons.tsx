// src/components/ui/Icons.tsx
import { FC } from "react";
import { IconProps } from "@/types";

const MaterialIcon: FC<{ iconName: string; className?: string }> = ({
  iconName,
  className,
}) => (
  <span className={`material-symbols-outlined ${className}`}>{iconName}</span>
);

export const ShieldCheckIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="verified_user" className={className} />
);
export const CameraIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="photo_camera" className={className} />
);
export const UserCircleCheckIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="badge" className={className} />
);
export const ShieldLockIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="shield_lock" className={className} />
);
export const CheckCircleIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="check_circle" className={className} />
);
export const XCircleIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="cancel" className={className} />
);
export const InformationCircleIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="info" className={className} />
);
export const ArrowLeftIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="arrow_back" className={className} />
);
export const QuestionMarkCircleIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="help_outline" className={className} />
);
export const WarningIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="warning" className={className} />
);
export const PlayCircleIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="play_circle" className={className} />
);
export const EditIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="edit" className={className} />
);
export const DownloadIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="download" className={className} />
);
export const ShareIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="share" className={className} />
);
export const ReplayIcon: FC<IconProps> = ({ className }) => (
  <MaterialIcon iconName="replay" className={className} />
);
