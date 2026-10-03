// Flag artwork ships inside geora-globe, so the demo reads the same URLs the
// beacons do instead of keeping a second copy in its public directory.
import { bundledFlag } from 'geora-globe'

export const flagUrl = (iso2, retina = false) => bundledFlag(iso2, retina)