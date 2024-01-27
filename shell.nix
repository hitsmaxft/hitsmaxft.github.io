with import <nixpkgs>
{ 
  overlays = [
    (import ~/.config/nix-darwin/home-manager/overlays)
  ];
};
mkShell {
  buildInputs = [
    nodejs_18
    hexo-cli
    nodeCustom.cnpm
  ];
}
