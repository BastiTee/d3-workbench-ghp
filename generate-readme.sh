#!/bin/bash
cd "$( dirname "$( readlink -f "$0" )" )"
{
find -maxdepth 1 -type d | grep -v -e "^\.$" -e ".git" | sort -r |\
while read dir
do
    bn=$( basename $dir )
    echo -e "# $bn\n"
    find $bn -type f | awk '{ print length($0) " " $0; }' $file | sort -n |\
    cut -d ' ' -f 2- | while read file
    do
        echo " - [$( basename $file )]($file)"
    done
    echo -e "\n---\n"
cat << EOF
All files in this repository are release snapshots of [d3-workbench](https://github.com/BastiTee/d3-workbench). See respective [license file](https://github.com/BastiTee/d3-workbench/LICENSE) inside the source repository.
EOF
done
} > README.md
cat README.md