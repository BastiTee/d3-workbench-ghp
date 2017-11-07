#!/bin/bash
cd "$( dirname "$( readlink -f "$0" )" )"
{
find -maxdepth 1 -type d | grep -v -e "^\.$" -e ".git" | sort -r |\
while read dir
do
    bn=$( basename $dir )
    echo -e "# $bn\n"
    find $bn -type f | while read file
    do
        echo " - [$( basename $file )]($file)"
    done
    echo
done
echo "---"
} > README.md