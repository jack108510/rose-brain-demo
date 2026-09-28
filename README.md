# Rose brain demo

An illustrated Rose conversation with a rotating 3D brain workflow map. Twenty example conversations rotate through quotes, bookings, purchases, receipts, and support, with thirty tools represented in the network. The anatomical 3D brain uses MRI-derived cortical geometry, soft lighting, and a ground shadow. Drag or use arrow keys to rotate it; double-click or press Home to reset the view. Geometry and rendering dependencies are bundled locally; credits and provenance are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Tool bulbs and notification cards follow each conversation's timeline.

**Live demo:** https://jack108510.github.io/rose-brain-demo/

This is a scripted visual simulation. It makes no API calls, requests no microphone access, and plays no audio. Chat shows the illustrated transcript; End pauses the simulation and Start talking resumes it. The example integrations do not execute real actions.

## Local preview

```sh
python3 -m http.server 8801 --bind 127.0.0.1
```

Open http://127.0.0.1:8801/. No build or dependencies are required.

## Deployment

GitHub Pages serves the root of the `main` branch. Push updates to `main` to publish them.
