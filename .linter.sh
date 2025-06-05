#!/bin/bash
cd /home/kavia/workspace/code-generation/recipemate-31245-3364d1ae/recipe_mate_web
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

