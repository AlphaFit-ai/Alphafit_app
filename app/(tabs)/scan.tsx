import { useEffect } from 'react';
import { useOpenFoodScan } from '../../src/scan/openScan';

/**
 * The slot of the centre scan button in the tab bar. The button itself (`src/scan/ScanTabButton`)
 * opens the food scan in the Diet tab and never selects this route; a link to `/scan` lands here and is
 * sent on the same way.
 */
export default function ScanTab() {
  const openScan = useOpenFoodScan();
  useEffect(() => {
    openScan({ feedback: false });
  }, [openScan]);
  return null;
}
