# CLOUDS ARE NOT AN OPTION @HiddenLayersConference

_This repository documents the **CLOUDS ARE NOT AN OPTION** workhop at the [Hidden Layers Conference](https://hiddenlayers.de/) for AI and Design at [Köln International School of Design](https://kisd.de/en/) from June 12-15, 2024_

<details>
  <summary>View Workshop Description</summary>
The workshop CLOUDS ARE NOT AN OPTION will contextualise recent AI systems according to their scale and within their vast infrastructure in that current developments in large language models manifest two main characteristics: as big as possible -- and as open as necessary. In this workshop we will take a closer look at the implications of the corporate min-maxing of both features by questioning the apparent 'openness' and fixation on large scale parameter values of these systems. The current critical AI discourse and prevailing local-first approaches will guide us along the way and form an intersection that will serve as a necessary critical toolset to approach the responsible and sustainable integration of AI technologies in user applications.
Together we aim to provide a basic understanding of the internal mechanisms of large language models, their underlying training structure, datasets and tools, while offering concrete practical insights into how to run small scale models, offline and locally using alternative open source approaches. The outcome of this workshop will be a collective screencast, which shares our gathered insights and yields an alternative way to practise the ambiguous technological stack.
</details>

## Resources
- 🦜
- Open Source Paper
- ChatGPT Filter
- Sydney System Prompt
- Rube Goldberg machine
Phönomene Zeigen

## Workshop Concept
In the workshop we use a custom made interface to chain multiple LLMs that run locally on the participants computers. Each group of participants should decide on a base model and adjust a custom model file. The goal is that very group develops a concept of their model, that serves a certain purpose or represents a certain persona. The workshop will result in a collective performance, the output from one group's model serves as the input for the next group's model, similar to a [Ruth Goldberg machine](https://en.wikipedia.org/wiki/Rube_Goldberg_machine). The workshop will alternate between group work and collaborative testing to adapt the models for performance. 

### Steps:
1. Install Ollama on your computer: Follow the provided instructions that explain how to run a LLM locally.
2. Download the custom interface: Follow the provided instructions to set up your computer in order to take part in the collective performance.  
3. Conceptualize your model: Think about a concept, narrative, or persona for your model.  
4. Adjust your custom model: Modify the custom model file to align with your chosen concept, narrative, or persona. Edit the exmaple.png in the canao folder and create your own visual. 
5. Test the model: Use the terminal interface to test your customized model.  
6. Collaborative tests: Get together with other groups to test the collective performance using the custom interface. Define an order for the models. 
7. Iterate and refine: Based on the performance test, return to step 4 to further adjust and improve your model. Iterate until the time is up.  

### Timeline

14:00 – 14:15 15 min **Welcome**  
14:15 – 14:45 30 min **Input**  
14:45 – 15:15 30 min **Setup** (Step 1-2)  
15:15 – 15:45 30 min **Group Work** (Step 3-5)  

15:45 – 16:15 30 min **Collaborative Test** (Step 6)  
16:15 – 17:15 60 min **Group Work**, we start a collaborative test every 15 min (Step 7)  
17:15 – 17:30 15 min **Performance Preperation, Setup**  

18:15 – 18:30 15 min **Workshop Results**

### Presentation

What is fixed:
- Each group has one computer that represents one concept and runs one LLM locally
- The computers are chained and respond to each other

What has to be defined:
- Order of the chain
- Are the concepts explained? If so, at what point?
- Are the system prompts / concepts visually displayed at the presentation?
- 



## Install Ollama and configure a custom model 

### Install a local instance of Ollama

1. Download [Ollama](https://www.ollama.com/)
2. Open Ollama
3. Set enviroment variable, `OLLAMA_HOST = 0.0.0.0` [read the docs for instructions on how to set enviroment variables on Windows/MacOS/Linux](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-do-i-configure-ollama-server). 
4. Also set the enviroment variable `OLLAMA_ORIGINS "*"` The enviroment variables are required to enable our computers to communicate with each other. Step 3 and 4 are not required when you just want to use Ollama locally. But we need it for our custom interface to work.

### Base Models
Ollama comes with a [selection of suppoted models](https://ollama.com/library) that have been trained and fine-tuned for different purposes. You can download and run any of these models as long as they fit into your computers RAM. 


### Custom Models
You can create custom models that uses a Base Model as a reference. There are a variety of parameters that you can adjust to your needs. [Read the docs](https://github.com/ollama/ollama/blob/main/docs/modelfile.md) to find out more about the parameters. 

1. Create a model file
- MacOs/Linux: `nano Modelfile`
- Windows: Use File Explorer to create a new .txt file, call it "Modelfile", edit the file and remove the ".txt" extension
2. `ollama create choose-a-model-name -f ./Modelfile`
3. `ollama run choose-a-model-name`
4. Start using the model!

**Example Modelfile**
``` 
# set the base model to use a reference
FROM llama3

# set the temperature to 1 [higher is more creative, lower is more coherent]
PARAMETER temperature 1

# set the system message
SYSTEM """You are Mario from Super Mario Bros. Answer as Mario, the assistant, only."""
```

## Install the custom interface

1. Download the [canao](https://github.com/gruppe5org/canao.git) repository. 
2. Open the repository, navigate into the "interface"-folder, open the index.html in your browser.
3. The performance needs one "controller"-computer, that defines the order of the performance and is needed to start and stop it. This computer needs Node.js installed and has to run `npm runs start` in the home folder of the canao repository. 

## Authors
This repo is maintained by [Kjell Wistoff](https://github.com/wistoff) and [Conrad Weise](https://github.com/cccccccccccccccccnrd), who also give the workshop.

## Credits
The workshop title was inspired from the Signal sticker pack [In The Ruins of Big Tech](https://signal.art/addstickers/#pack_id=6e69c3260e3c7378c0f35b86342e6f72&pack_key=f6940570bf17201e7288874ced7e32098df100705dc7862af3c2c026b32a8f9a) by [A Traversal Network of Feminist Servers](https://varia.zone/ATNOFS/).


