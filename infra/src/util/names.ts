const PROJECT_PREFIX = "sk-aws-workshop" // todo add your initials here!

export const prefixedId = (id: string) => {
  return `${PROJECT_PREFIX}-${id}`
}
