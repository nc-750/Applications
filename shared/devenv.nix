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
  
  # https://devenv.sh/scripts/
  # scripts = {
  # };

  # https://devenv.sh/tasks/
  # tasks = {
  # };

  # https://devenv.sh/tests/
  enterTest = ''
    echo "Running tests"
    git --version | grep --color=auto "${pkgs.git.version}"
  '';

  # https://devenv.sh/git-hooks/
  # git-hooks.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
