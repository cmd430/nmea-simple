/**
 * Checks that the given NMEA sentence has a valid checksum.
 */
export function validNmeaChecksum(nmeaSentence: string): boolean {
  const [sentenceWithoutChecksum, checksumString] = nmeaSentence.split('*')

  const correctChecksum = computeNmeaChecksum(sentenceWithoutChecksum!)

  // checksum is a 2 digit hex value
  const actualChecksum = parseInt(checksumString!, 16)

  return correctChecksum === actualChecksum
}


/**
 * Generate a checksum for an NMEA sentence without the trailing '*xx'.
 */
export function computeNmeaChecksum(sentenceWithoutChecksum: string): number {
  // init to first character value after the $
  let checksum = sentenceWithoutChecksum.charCodeAt(1)

  // process rest of characters, zero delimited
  for (let i = 2; i < sentenceWithoutChecksum.length; i += 1) {
    checksum = checksum ^ sentenceWithoutChecksum.charCodeAt(i)
  }

  // checksum is between 0x00 and 0xff
  checksum = checksum & 0xff

  return checksum
}


// =========================================
// field traditionalDecoders
// =========================================

/**
 * Parse the given string to a float, returning 0 for an empty string.
 */
export function parseFloatSafe(str?: string): number {
  if (str === undefined || str === '') {
    return 0.0
  }
  return parseFloat(str)
}


/**
 * Parse the given string to a integer, returning 0 for an empty string.
 */
export function parseIntSafe(i?: string): number {
  if (i === undefined || i === '') {
    return 0
  }

  return parseInt(i, 10)
}

export function parseStringSafe(str?: string): string {
  return str ?? ''
}


/**
 * Parse the given string to a float if possible, returning 0 for an undefined
 * value and a string the the given string cannot be parsed.
 */
export function parseNumberOrString(str?: string): number | string {
  if (str === undefined) {
    return ''
  }

  const num = parseFloat(str)

  return Number.isNaN(num) ? str : num
}


/**
 * Parses coordinate given as 'dddmm.mm', 'ddmm.mm', 'dmm.mm' or 'mm.mm'
 */
export function parseDmCoordinate(coordinate: string): number {

  const dotIdx = coordinate.indexOf('.')

  if (dotIdx < 0) {
    return 0
  }

  let degrees: string
  let minutes: string

  if (dotIdx >= 3) {
    degrees = coordinate.substring(0, dotIdx - 2)
    minutes = coordinate.substring(dotIdx - 2)
  } else {
    // no degrees, just minutes (nonstandard but a buggy unit might do this)
    degrees = '0'
    minutes = coordinate
  }

  return (parseFloat(degrees) + (parseFloat(minutes) / 60.0))
}

/**
 * Parses latitude given as 'ddmm.mm', 'dmm.mm' or 'mm.mm' (assuming zero
 * degrees) along with a given hemisphere of 'N' or 'S' into decimal degrees,
 * where north is positive and south is negative.
 */
export function parseLatitude(lat: string, hemi: string): number {
  const hemisphere = (hemi === 'N') ? 1.0 : -1.0

  return parseDmCoordinate(lat) * hemisphere
}


/**
 * Parses latitude given as 'dddmm.mm', 'ddmm.mm', 'dmm.mm' or 'mm.mm' (assuming
 * zero degrees) along with a given hemisphere of 'E' or 'W' into decimal
 * degrees, where east is positive and west is negative.
 */
export function parseLongitude(lon: string, hemi: string): number {
  const hemisphere = (hemi === 'E') ? 1.0 : -1.0

  return parseDmCoordinate(lon) * hemisphere
}

function getYearFromString(yearString: string, rmcCompatible: boolean): number {
  if (yearString.length === 4) {
    return Number(yearString)
  } else if (yearString.length === 2) {
    if (rmcCompatible) {
      // GPRMC date doesn't specify century. GPS came out in 1973 so if the year
      // is less than 73, assume it's 20xx, otherwise assume it is 19xx.
      let year = Number(yearString)

      if (year < 73) {
        year = 2000 + year
      }
      else {
        year = 1900 + year
      }

      return year
    }
    else {
      return Number('20' + yearString)
    }
  }
  else {
    throw Error(`Unexpected year string: ${yearString}`)
  }
}

/**
 * Parses a UTC time and optionally a date and returns a Date
 * object.
 * @param {String} time Time the format 'hhmmss' or 'hhmmss.ss'
 * @param {String=} date Optional date in format the ddmmyyyy or ddmmyy
 * @returns {Date}
 */
export function parseTime(time: string, date?: string, rmcCompatible = false): Date {

  if (time === '') {
    return new Date(0)
  }

  const ret = new Date()

  if (date) {

    const year = date.slice(4)
    const month = parseInt(date.slice(2, 4), 10) - 1
    const day = date.slice(0, 2)

    ret.setUTCFullYear(getYearFromString(year, rmcCompatible), Number(month), Number(day))
  }

  ret.setUTCHours(Number(time.slice(0, 2)))
  ret.setUTCMinutes(Number(time.slice(2, 4)))
  ret.setUTCSeconds(Number(time.slice(4, 6)))

  // Extract the milliseconds, since they can be not present, be 3 decimal place, or 2 decimal places, or other?
  const msStr = time.slice(7)
  const msExp = msStr.length
  let ms = 0
  if (msExp !== 0) {
    ms = parseFloat(msStr) * Math.pow(10, 3 - msExp)
  }
  ret.setUTCMilliseconds(Number(ms))

  return ret
}
