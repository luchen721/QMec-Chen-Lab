import { siteContent } from '../../data/siteContent';
import { Materials } from './Materials';
import { Tools } from './Tools';

export function Research() {
  const { research } = siteContent;

  return (
    <>
      <Materials materials={research.materials} />
      <Tools tools={research.tools} />
    </>
  );
}

