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
      version=$1
      
      if [ "$version" -eq "" ]; then
        echo "A version is needed for releasing"
        exit 1;
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

      bump-version $version
      retval=$?

      if [ $retval -ne 0 ]; then
        echo "Bump version failed"
        exit $retval
      fi

      git commit -m "Mirror release: v$version"
      git tag "Mirror-v$version"
      git push --follow-tags
    '';

    deploy.exec = ''
      version=$1

      if [ "$version" -eq "" ]; then
        echo "A version is needed for deploying"
        exit 1;
      fi

      release "$version" "$message"

      cd dist
      git commit -m "Mirror release: v$version"
      git tag "v$version"
      git push --follow-tags
    '';
  };
}
