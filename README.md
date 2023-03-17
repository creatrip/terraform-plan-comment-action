```yml
steps:
  - uses: creatrip/terraform-plan-comment-action@v1
    with:
      issue-number: ${{ github.event.number }}
      directory: ''
      stdout: ''
      stderr: ''
```
