import { sudo } from '../../util/linux-installer';

export default async (filePath) => {
  sudo('RPM', 'dnf', `--assumeyes --nogpgcheck install ${filePath}`);
};
