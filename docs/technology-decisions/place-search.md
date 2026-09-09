# Preview location search

The location picker offers local preset suggestions as the user types, plus
explicit online lookup through `GET /api/places?q=...` on Enter or search click.
Selecting a result commits its coordinates; submitting a query never selects
the first candidate automatically. Rental inventory is still synthetic.

The server calls Photon at `https://photon.komoot.io/api/` with an eight-result
limit and the Metro Cebu preview envelope `123.75,10.18,124.05,10.5`. This is a
preview coverage rectangle, not an administrative boundary. Responses must
identify the Philippines and contain coordinates inside that envelope.

No package, paid account, or API key is required. Photon is an Apache-2.0
open-source geocoder, and its results use OpenStreetMap data (ODbL). The picker
links to OpenStreetMap attribution. The public demo allows reasonable use and
can throttle requests or change availability; it is not a production SLA.

The preview uses an eight-second upstream timeout, at most one uncached lookup
per second per server process, and a bounded 100-query one-hour memory cache.
Client requests abort when superseded, and only the current request can update
the suggestions. Errors preserve local suggestions and offer retry. Revisit
provider hosting and shared rate limiting before a multi-instance deployment.

Source references, reviewed 2026-09-08:

- [Photon API parameters](https://github.com/komoot/photon/blob/master/docs/api-v1.md)
- [Photon public demo policy and source license](https://github.com/komoot/photon)
- [OpenStreetMap attribution and license](https://www.openstreetmap.org/copyright)
- [WAI combobox keyboard guidance](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

The local API schema isolates Photon from the UI so the adapter can be replaced.
No geographic search is delegated to a model. Automated tests use synthetic
geocoder results; live lookup is a separate, low-volume browser check.
