environments=$1
pathToOutput="../compiled"
rm -rf $pathToOutput
mkdir $pathToOutput
for environment in $environments
do
  ytt -f . --data-value environment=$environment > $pathToOutput/$environment.yml
done