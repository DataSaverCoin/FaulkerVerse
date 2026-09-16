# St. Louis landmark refresh — Android 1.2

The existing city now includes 16 landmark tour stops. Use **Landmarks** in the
upper-right panel, choose a place, then **Visit** for walking or **City view** for
an exterior overview. **Back to avatar** restores the normal camera. The overview
hides fare and interaction overlays so the building is easier to see.

## Appearance

- CITYPARK: mapped stadium site, open silver canopy, exposed steel columns/trusses,
  red stepped stands, white CITY seating graphic, scoreboard, striped match pitch
  and goals. Three OSM practice fields include markings, goals, fencing and lights.
- Police Headquarters, 1915 Olive: taller buff masonry block, vertical piers,
  arched ground-floor glazing, blue entrance canopy and lettering.
- Cookies, 2001 Olive: updated the existing former Viola footprint with blue fascia,
  stone-colored storefront, glazing and Cookies lettering.
- Maggie O’Brien’s: green two-storey pub exterior, contrasting trim and awnings.
- Drury at Union Station / Lombardo’s: red masonry, four floors, ground-floor
  arches, hotel lettering and a contrasting vertical restaurant sign.
- Paddy O’s: red masonry, green awnings, rooftop railings, tables and parasols.
- White Castle: both mapped in-range locations receive white walls, blue trim,
  awnings and crenellated parapets.
- Imo’s: headquarters and mapped 1701 Delmar storefront receive red/green signage.
- Hyatt at the Arch: corrected tall massing, limestone-colored window grid and bands.
- Hampton at the Arch: corrected tall massing, terracotta lower floors, cream upper
  floors and a red roof band. Drury Plaza at the Arch also receives a custom facade.

These are stylized, lightweight exterior approximations, not surveyed replicas.
No interiors or shopping functionality are included. Signs use locally drawn text,
not downloaded logos or photo textures. Existing street-cleared building footprints
remain the source for walls/collision; stadium parts replace overlapping generic
roof extrusions. Soccer fields use newly bundled OSM outlines in citypark.json.
Small details merge by material to limit additional phone draw calls.

## References

- Stadium architecture and campus: https://www.hok.com/projects/view/mls-st-louis-city-sc-citypark/
- Club campus and three pitches: https://www.stlcitysc.com/news/campus-unveiled-south-of-stadium
- CITYPARK is the familiar former stadium name; the HOK page uses Energizer Park.
- Police location: https://slmpd.org/civilrights/
- Police exterior photo: https://www.stlpr.org/law-order/2024-06-10/st-louis-missouri-police-unsolved-murders-takeaways
- Cookies location and brand frontage: https://cookiesdowntownstlouis.com/visit-us/
  The site's exterior image carries an AI-generated-content label; it was used as
  a branding reference, not evidence of exact architectural dimensions.
- Former Viola address: https://www.stlamerican.com/news/local-news/larry-hughes-says-violastl-dispensary-in-my-silo/
- Maggie exterior: https://www.maggieobriens.com/downtown
- Lombardo's within Drury Union Station: https://lombardostrattoria.com/
- Drury exterior: https://www.traveldepartment.com/hotels/drury-inn-union-station
- Paddy exterior: https://www.gpsmycity.com/attractions/paddy-os-11130.html
- White Castle exterior: https://www.thebethlists.com/diverse-dining-list/white-castle-in-st-louis
- Imo's locations: https://www.imospizza.com/locations/
- Hyatt exterior: https://www.hyatt.com/en-US/hotel/missouri/hyatt-regency-st-louis-at-the-arch/stlrs
- Hampton gallery: https://www.hilton.com/en/hotels/stldthx-hampton-st-louis-downtown-at-the-gateway-arch/gallery/
- Map geometry: OpenStreetMap contributors, ODbL-1.0, retrieved 2026-09-15 via
  Overpass; the supplemental data retains source way IDs and attribution.

## Build and device inspection

`python3 android/build.py --output /absolute/path/to/artifacts`

Produces FaulkerVerse-1.2.apk (versionCode 3), signed with the existing local key.
ADB installation is an update; it does not uninstall or clear the app's storage.
For explicit local inspection, launch with `--ez inspect_webview true` and forward
that process's WebView devtools socket. Debugging is off on a normal app launch.
The native GPU canvas is absent from CDP page screenshots on this device; use
`adb exec-out screencap -p` for actual rendered screen evidence.
