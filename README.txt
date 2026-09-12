ALRMS ALMED IMS — Revision 80

Fix: Integration & Harmonization Summary Card and Interactive Map

Source Google Sheet:
https://docs.google.com/spreadsheets/d/1_K8VRKFQ4bXzSMCbt7VaF7omJLqT0Q8ouKdKzkvuyHA/edit?pli=1&gid=2133670872#gid=2133670872

Sheet/tab: 2026 (gid 2133670872)
Columns used:
- B = PROVINCE
- C = MUNICIPALITY
- D = Date (used for newest municipality request on the map)
- S = Status

Shared classification rules used by BOTH the Summary Card and Interactive Map:
- Completed: Completed
- Processing: Waiting for Certification; For final processing of data; For initial process; No technical discussion yet; Consultation meeting
- Pending: Incomplete requirements
- Any other/blank status is not counted and does not color a municipality as integrated.
- Municipalities with no matched Municipality + Province and no qualifying status are No Integration.

The Google Visualization request now retrieves B,C,D,S without server-side date sorting/filtering, then the browser applies the exact status rules. This avoids the prior zero-count condition caused by a fragile query. The map uses the same classified rows and keeps the newest row for each Municipality + Province.

Live refresh: every 15 seconds.


REVISION 81 CHANGES
- Restored the Revision 71 Integration & Harmonization Summary Card counting ruling.
- Integration source restored to Google Sheet tab gid 0, as used by Revision 71.
- Shared classification now applies to both Summary Card and Interactive Map: Completed; Waiting for Certification/For final processing of data/For initial process; No technical discussion yet/Consultation meeting/Processing = Processing; Incomplete requirements/Pending = Pending.
- Live query uses B,C,D,S with S not null, so the same records drive the map.
- Map starts one zoom level closer after fitting the Philippines municipal boundary layer.


REVISION 84 MAP ENHANCEMENT
- Added an Esri Street Map basemap as the default background.
- Added a basemap switcher with Street Map and Satellite Imagery.
- Municipal status polygons remain the primary overlay and retain the live Integration & Harmonization classification.
- OpenStreetMap tiles are not used.
