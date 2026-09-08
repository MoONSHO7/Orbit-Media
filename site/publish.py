"""Review or publish the generated gallery to gh-pages without changing the live checkout."""
import argparse
import json
import subprocess
from pathlib import Path

SITE = Path(__file__).resolve().parent
REPO = SITE.parent
BRANCH = "refs/heads/gh-pages"
SUBJECT = "docs(pages): open directly on the artwork gallery"


def git(*arguments, data=None):
    result = subprocess.run(["git", "-C", str(REPO), *arguments], input=data,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return result.stdout.decode("utf-8").strip()


def publish(do_publish):
    output = SITE / "dist"
    catalog = json.loads((output / "catalog.json").read_text(encoding="utf-8"))
    names = [".nojekyll", "index.html", "style.css", "gallery.js", "catalog.json", "orbit.png",
             "MEDIA-LICENSE.txt", "LIBRARY-LICENSE.txt", "docs/media.html", "docs/glows.html", "docs/gallery.html"]
    names.extend(sorted(catalog["assets"]))
    if len(names) != len(set(names)):
        raise RuntimeError("Duplicate website paths")
    paths = [output / name for name in names]
    for path in paths:
        if not path.is_file() or not path.resolve().is_relative_to(output.resolve()):
            raise RuntimeError(f"Website file is missing or outside dist: {path}")
    remote = git("ls-remote", "origin", BRANCH).split()[0]
    local = git("rev-parse", BRANCH)
    if remote != local:
        raise RuntimeError("gh-pages changed upstream. Review the newer branch before publishing.")
    print(f"Website only: {len(names)} files; {len(catalog['icons'])} icon glows, "
          f"{len(catalog['dispels'])} dispel glows, {len(catalog['fills'])} status-bar fills, "
          f"{len(catalog['borders'])} borders.")
    print(f"Parent: {remote}")
    print(f"Active checkout: {git('branch', '--show-current')}")
    if not do_publish:
        print("Review only. Use --publish to update gh-pages.")
        return
    blob_ids = git("hash-object", "-w", "--stdin-paths",
                   data=("\n".join(path.as_posix() for path in paths) + "\n").encode("utf-8")).splitlines()
    if len(blob_ids) != len(names):
        raise RuntimeError("Incomplete website object list")
    tree = {}
    for name, blob in zip(names, blob_ids):
        node = tree
        parts = name.split("/")
        for part in parts[:-1]:
            node = node.setdefault(part, {})
        node[parts[-1]] = blob

    def write_tree(node):
        entries = []
        for name, value in sorted(node.items()):
            if isinstance(value, dict):
                entries.append(f"040000 tree {write_tree(value)}\t{name}\n")
            else:
                entries.append(f"100644 blob {value}\t{name}\n")
        return git("mktree", data="".join(entries).encode("utf-8"))

    tree_id = write_tree(tree)
    if tree_id == git("rev-parse", f"{remote}^{{tree}}"):
        print("The published gallery already matches this build.")
        return
    commit = git("commit-tree", tree_id, "-p", remote, data=(SUBJECT + "\n").encode("utf-8"))
    subprocess.run(["git", "-C", str(REPO), "push", "origin", f"{commit}:{BRANCH}"], check=True)
    git("update-ref", BRANCH, commit, local)
    print(f"Published {commit} to gh-pages.")
    print("https://moonsho7.github.io/Orbit-Media/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--publish", action="store_true", help="Publish this build; otherwise review only")
    publish(parser.parse_args().publish)
