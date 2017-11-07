#!/bin/bash
cd "$( dirname "$( readlink -f "$0" )" )"
{
    function process_dir {
        bn=$( basename $1 )
        echo -e "## $bn\n"
        find $bn -type f | awk '{ print length($0) " " $0; }' $file | sort -n |\
            cut -d ' ' -f 2- | while read file
        do
            echo " - [$( basename $file )]($file)"
        done
        echo -e "\n---\n"
    }
    echo -e "# Main releases\n"
    find -maxdepth 1 -type d | grep -v -e "-pre" -e "^\.$" -e ".git" |\
    sort -r | while read dir; do process_dir $dir; done
    echo -e "# Pre-releases\n"
    find -maxdepth 1 -type d | grep -v -e "^\.$" -e ".git" | grep "pre" |\
    sort -r | while read dir; do process_dir $dir; done
    cat << EOF
## License and further information

All files in this repository are release snapshots of [d3-workbench](https://github.com/BastiTee/d3-workbench). See respective [license file](https://github.com/BastiTee/d3-workbench/blob/master/LICENSE) inside the source repository.
EOF
} > README.md
cat README.md