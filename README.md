```yml
steps:
  - uses: creatrip/terraform-plan-comment-action@v1
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      directory: ''
      stdout: ''
      stderr: ''
```
