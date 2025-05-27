# JSDiceplot

This is a minimal D3-based dice-plot implementation from the repository:  
👉 [github.com/maflot/Diceplot](https://github.com/maflot/Diceplot)

## Features

- Static examples for 1 to 6 dice faces (1×1 grid).
- Interactive grid (8×8) where the number of visible faces per cell can be selected via dropdown.
- Pure HTML + JavaScript + D3 (v7), no build system required.

## Files

- `example.html` – Main page showing static and interactive dice plots.
- `diceplot.js` – Minimal ES module implementing the dice plot renderer.
- `d3.v7.min.js` – Loaded from CDN.

## Usage

### Run locally

To run this example correctly, you must serve it via HTTP:

```bash
# Navigate to the folder containing example.html and diceplot.js
cd path/to/repo

# Use a simple Python server (Python 3.x)
python3 -m http.server 8000

# Or using Node.js if installed
npx http-server . -p 8000
```

Then open in your browser:

```bash
http://localhost:8000/example.html
```
Opening the file directly (file://) might not directly work (tested using brave browser)

## Citation

If you use this code or the R and Python packages for your own work, please cite diceplot as:
  
> M. Flotho, P. Flotho, A. Keller, "Diceplot: A package for high dimensional categorical data visualization," arxiv, 2024. [doi:10.48550/arXiv.2410.23897](https://doi.org/10.48550/arXiv.2410.23897)

BibTeX entry:
```
@article{flotea2024,
    author = {Flotho, M. and Flotho, P. and Keller, A.},
    title = {Diceplot: A package for high dimensional categorical data visualization},
    year = {2024},
    journal = {arXiv preprint},
    doi = {https://doi.org/10.48550/arXiv.2410.23897}
}
```