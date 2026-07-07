{ pkgs, lib, config, inputs, ... }:

{
  packages = with pkgs; [
    git
  ];

  languages = {
    javascript = {
      enable = true;
      lsp.enable = true;
      bun.enable = true;
    };

    typescript = {
      enable = true;
      lsp.enable = true;
    };

    rust = {
      enable = true;
    };
  };
}
