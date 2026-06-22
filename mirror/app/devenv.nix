{ pkgs, lib, config, inputs, ... }:

{
  scripts = {
    dev.exec = "bun run dev";
    run-test.exec = "bun run test";
    build.exec = "bun run build";
    
    bump-version.exec = ''
      version=$1
      echo "Bumping version to $version"
      cargo set-version $version --manifest-path src-tauri/Cargo.toml
      bun pm version $version --no-git-tag-version
    '';
        
    release.exec = ''
      version="$1"
      
      if [ "$version" -z ]; then
        echo "A version is needed for releasing"
        exit 1;
      fi

      bump-version $version
      retval=$?

      if [ $retval -ne 0 ]; then
        echo "Bump version failed"
        exit $retval
      fi

      run-test
      retval=$?

      if [ $retval -ne 0 ]; then
        echo "Tests failed"
        exit $retval
      fi

      build
      retval=$?

      if [ $retval -ne 0 ]; then
        echo "Build failed"
        exit $retval
      fi

      newtag="Mirror-v$version"
      message="Mirror release: v$version"

      git add package.json src-tauri
      git commit -m "$message"
      git tag -a $newtag -m "$message"
      git push --follow-tags
    '';

    deploy.exec = ''
      set -euo pipefail
      
      version=$(git describe --abbrev=0 | cut -d '-' -f 2)
      message="Mirror release: $version"

      cp -r dist/* ../deployed-app/
      cd ../deployed-app

      git add -A
      git commit -m "$message" || { echo "No changes to deploy"; exit 0; }
      git push origin main
      
      git tag -a "$version" -m "$message" || echo "Tag $version already exists"
      git push origin "$version"
    '';
  };
}
