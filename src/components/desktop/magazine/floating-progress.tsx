interface Section {
  id: string;
  label: string;
}

interface FloatingProgressProps {
  sections: Section[];
}

/** Removed per design philosophy — side navigation dots distract from reading flow */
export function FloatingProgress(_props: FloatingProgressProps) {
  return null;
}
