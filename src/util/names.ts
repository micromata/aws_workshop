const PROJECT_PREFIX = "ht-aws-workshop"

export const prefixedId = (id: string) => {
  return `${PROJECT_PREFIX}-${id}`
}